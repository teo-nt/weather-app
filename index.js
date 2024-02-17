const API_KEY = 'YOUR API KEY'
const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
let i = 0

$(function() {
    let debounceTimeout
    $('#inputCity').on('input', function() {
        clearTimeout(debounceTimeout)
        debounceTimeout = setTimeout(() => getCity(this.value.trim()), 1500)
    })
})

function getCity(city) {
    if (!city) return
    onBeforeSend()
    fetchWeatherFromAPI(city)
}

/**
 * Remove any weather information and errors from a previous search and show loading gif.
 */
function onBeforeSend() {
    i = 0
    showComponent('#loading')
    $('.container > #weather').remove()
    $('.container > #carousel').remove()
    $('.container > #error').remove()
    $('.container > #unauthorized').remove()
}

/**
 * Fetches data from weather API.
 * 
 * @param {*} city  the input city.
 */
function fetchWeatherFromAPI(city) {
    const xhrCurrentWeather = new XMLHttpRequest()
    const xhrForecast = new XMLHttpRequest()
    
    xhrCurrentWeather.open('GET', `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`, true)
    xhrForecast.open('GET', `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`, true)
    const requests = [xhrCurrentWeather, xhrForecast]
    requests.forEach((request) => {
        request.addEventListener('readystatechange', function() {
            if (this.readyState === 4) {
                if (this.status === 200) {
                    handleResults(JSON.parse(this.responseText))
                } else if (this.status === 401) {
                    onNotAuthorised()
                } else {
                    onApiError()
                }
                hideComponent('#loading')
            }
        })
        request.send()
    })
}

/**
 * Handles the results of the HTTP response.
 * 
 * @param {*} response  the http response (as JS object).
 */
function handleResults(response) {
    if (!response) return
    if (response.hasOwnProperty('list')) {
        onForecast(response)
    } else {
        onCurrentWeather(response)
    }
}

/**
 * Match the data to the appropriate UI element if the 
 * response is for current weather.
 * 
 * @param {*} response  the JS object response about current weather.
 */
function onCurrentWeather(response) {
    const $currentWeather = $('body > #weather').clone().removeClass('d-none')
    $currentWeather.find('#location strong').text((response.sys.country) ? response.name + ', ' + response.sys.country : response.name)
    $currentWeather.find('#weather-icon').attr('src', `https://openweathermap.org/img/wn/${response.weather[0].icon}@2x.png`)
    $currentWeather.find('#description span').text(_.capitalize(response.weather[0].description))
    $currentWeather.find('#temperature span').text(Math.round(response.main.temp))
    $currentWeather.find('#feels-like span').text(Math.round(response.main.feels_like))
    $currentWeather.find('#humidity span').text(response.main.humidity)
    $currentWeather.appendTo('.container')
}

/**
 * Match the data to the appropriate UI elements if the 
 * response is about weather forecast.
 * 
 * @param {*} response  the JS object response about weather forecast.
 */
function onForecast(response) {
    const $forecastInfo = $('#carousel').clone().removeClass('d-none').appendTo('.container')
    for (const forecast of response.list) {
        const $indicator = $('#prototypeIndicator').clone().removeClass('d-none').attr('id', i)
        $indicator.attr('data-bs-slide-to', i)
        $indicator.attr('aria-label', "Slide " + (i + 1))

        const $weatherSlide = $('#slide').clone().removeClass('d-none').attr('id', 'slide' + i)
        if (i === 0) {
            $indicator.addClass('active')
            $indicator.attr('aria-current', 'true')
            $weatherSlide.addClass('active')
        }
        let formattedDateTime = getFormattedDateTime(forecast.dt_txt)
        $weatherSlide.find('#datetime').html(formattedDateTime)
        $weatherSlide.find('#weather-icon').attr('src', `https://openweathermap.org/img/wn/${forecast.weather[0].icon}@2x.png`)
        $weatherSlide.find('#description span').text(_.capitalize(forecast.weather[0].description))
        $weatherSlide.find('#temperature span').text(Math.round(forecast.main.temp))
        $weatherSlide.find('#humidity span').text(forecast.main.humidity)

        $forecastInfo.find('.carousel-indicators').append($indicator)
        $forecastInfo.find('.carousel-inner').append($weatherSlide)
        i++
    }
}

/**
 * Gets the datetime of forecasts and formats it to be user friendly.
 * 
 * @param {*} datetime      the datetime of forecast (in UTC).
 * @returns                 user-friendly formatted local datetime.
 */
function getFormattedDateTime(datetime) {
    const date = new Date(datetime + "Z")  // returned date is converted to local time.
    let day = days[date.getDay()]
    let monthDay = date.getDate().toString().padStart(2, "0")
    let month = months[date.getMonth()]
    let hour = date.getHours().toString().padStart(2, "0")
    let minute = date.getMinutes().toString().padStart(2, "0")
    return `${day}, ${monthDay} ${month} <br /> ${hour}:${minute}`
}

/**
 * Shows a UI element.
 * 
 * @param {*} element   the element to be diplayed.
 */
function showComponent(element) {
    $(element).removeClass('d-none')
}

/**
 * Hides a UI element.
 * 
 * @param {*} element   the element to be hidden.
 */
function hideComponent(element) {
    $(element).addClass('d-none')
}

/**
 * Shows an error if city is not found.
 */
function onApiError() {
    $('.container #error').remove()
    $('#error').clone().removeClass('d-none').appendTo('.container')
}

/**
 * Shows an error associated with API key.
 */
function onNotAuthorised() {
    $('.container #unauthorized').remove()
    $('#unauthorized').clone().removeClass('d-none').appendTo('.container')
}