var API_URL = "https://api.openweathermap.org/data/2.5/weather";
var STORAGE_KEY = "weatherSearchHistory";
var MAX_HISTORY = 5;

$(function () {
    // Popover ifall platsen kan inte hittas
    var popover = new bootstrap.Popover("#search-input", {
        trigger: "manual",
        title: "Location not found",
        content: "We couldn't find the city. Please try again!"
    });


    renderHistory();

    $("#btn-my-location").click(function () {
        navigator.geolocation.getCurrentPosition(function (pos) {
            getWeather({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        }, function () {
            alert("Unable to retrieve your location. Please allow location access and try again.");
        });
    });

    $("#search-input").keypress(function (e) {
        var city = $(this).val().trim();
        if (e.key === "Enter" && city) {
            getWeather({ q: city });
        }
    }).on("input", function () {
        popover.hide();
    });

    $("#history-list").on("click", "li[data-city]", function () {
        var city = $(this).data("city");
        $("#search-input").val(city);
        getWeather({ q: city });
    });

    // Hämtar vädern via Ajax
    function getWeather(params) {
        $.getJSON(API_URL, $.extend(params, { appid: API_KEY, units: "metric", lang: "sv" }))
            .done(function (data) {
                popover.hide();
                $("#weather-icon").attr("src", "https://openweathermap.org/img/wn/" + data.weather[0].icon + "@2x.png");
                $("#weather-name").text(data.name + ", " + data.sys.country);
                $("#weather-temp").text(Math.round(data.main.temp) + " °C");
                $("#weather-wind").text("Wind: " + data.wind.speed + " m/s");
                $("#weather-result").removeClass("d-none");
                if (params.q) {
                    saveSearch(data);
                }
            })
            .fail(function () {
                $("#weather-result").addClass("d-none"); // gamla resultat tas bort
                popover.show();
                setTimeout(function () { popover.hide(); }, 4000);
            });
    }

    function getHistory() {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]").map(function (item) {
            return typeof item === "string" ? { name: item } : item;
        });
    }
    function saveSearch(data) {
        var entry = {
            name: data.name,
            temp: Math.round(data.main.temp),
            wind: data.wind.speed,
            icon: data.weather[0].icon
        };
        var history = getHistory().filter(function (item) {
            return item.name.toLowerCase() !== entry.name.toLowerCase();
        });
        history.unshift(entry);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
        renderHistory();
    }

    // Hämtar historiken för stad, temperatur och vind
    function renderHistory() {
        var history = getHistory();
        $("#history-list").html(history.length
            ? history.map(function (item) {
                var icon = item.icon ? '<img class="history-icon" src="https://openweathermap.org/img/wn/' + item.icon + '@2x.png" alt="">' : "";
                var details = item.temp !== undefined ? " – " + item.temp + " °C, wind " + item.wind + " m/s" : "";
                return '<li class="list-group-item" data-city="' + item.name + '">' + icon + "<strong>" + item.name + "</strong>" + details + "</li>";
            }).join("")
            : '<li class="list-group-item text-muted">No searches yet</li>');
    }

});