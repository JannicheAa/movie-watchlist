const indexPageEl = document.getElementById("index-page");
const indexPagePlaceholderEl = document.getElementById(
  "index-page-placeholder"
);
const myWatchlistPageEl = document.getElementById("my-watchlist");
const inputEl = document.getElementById("input");
const searchBtnEl = document.getElementById("search-btn");
const linkToWatchlistEl = document.getElementById("link-to-watchlist");
const listOfFilmsEl = document.getElementById("list-of-films");
const myWatchlistEl = document.getElementById("my-watchlist");
const filmsFromLocalStorage = JSON.parse(localStorage.getItem("myWatchlist"));
const filmsFromLastSearchResult = JSON.parse(
  sessionStorage.getItem("searchResult")
);

let myWatchlist = filmsFromLocalStorage || [];
let searchResult = filmsFromLastSearchResult || [];
let alreadyInMyWatchlist = [];
let filmlistHtml = "";

if (indexPageEl) {
  if (filmsFromLocalStorage.length === 0) {
    renderEmptyIndexPageMessage();
  } else if (
    filmsFromLastSearchResult &&
    filmsFromLastSearchResult.length > 0
  ) {
    alreadyInMyWatchlist = filmsFromLastSearchResult.filter((filmFromResult) =>
      myWatchlist.find(
        (filmFromMyWatchlist) =>
          filmFromMyWatchlist.imdbID === filmFromResult.imdbID
      )
    );
    filmsFromLastSearchResult.forEach((film) => {
      indexPagePlaceholderEl.innerHTML = "";
      addFilmToListHtml(film, alreadyInMyWatchlist);
    });
  }
  renderFilmlist(listOfFilmsEl, filmlistHtml);

  searchBtnEl.addEventListener("click", function () {
    showSpinner();
    renderFilmlist(listOfFilmsEl, (listInHtml = ""));
    findFilms(inputEl.value);
  });
}

function findFilms(searchCriteria) {
  indexPagePlaceholderEl.innerHTML = "";
  searchResult = [];
  filmlistHtml = "";
  fetch(`https://www.omdbapi.com/?apikey=64994035&s=${searchCriteria}`)
    .then((response) => response.json())
    .then((data) => {
      if (data.Response === "True") {
        let fetchPromises = data.Search.map((searchMatch) => {
          return fetch(
            `https://www.omdbapi.com/?apikey=64994035&i=${searchMatch.imdbID}`
          )
            .then((response) => response.json())
            .then((film) => {
              if (film.Response === "True") {
                addFilmToListHtml(film, alreadyInMyWatchlist);
                searchResult.push(film);
                sessionStorage.setItem(
                  "searchResult",
                  JSON.stringify(searchResult)
                );
              } else {
                console.error("En feil oppstod:", data);
              }
            });
        });
        Promise.all(fetchPromises).then(() => {
          hideSpinner();
          renderFilmlist(listOfFilmsEl, filmlistHtml);
        });
      } else {
        sessionStorage.clear();
        setTimeout(function () {
          hideSpinner();
          indexPagePlaceholderEl.innerHTML = `
            <h2 class=".no-content-text-on-background">${data.Error} Try again.</h2>
          `;
        }, 1000);
        console.error("En feil oppstod:", data);
      }
    });
  inputEl.value = "";
}

if (myWatchlistPageEl) {
  if (filmsFromLocalStorage.length > 0) {
    filmsFromLocalStorage.forEach((film) => {
      addFilmToListHtml(film, filmsFromLocalStorage);
    });
    renderFilmlist(myWatchlistEl, filmlistHtml);
  } else {
    renderEmptyMyWatchlistMessage();
  }
}

function renderEmptyIndexPageMessage() {
  return (indexPagePlaceholderEl.innerHTML = `
    <img src="images/movie-icon.svg" />
    <h2 class="no-content-text-on-background">Begynn å utforsk</h2>`);
}

function renderEmptyMyWatchlistMessage() {
  return (myWatchlistEl.innerHTML = `
      <div class="my-watchlist-page-placeholder">
      <h2 class="no-content-text-on-background">
        Listen din ser litt tom ut...
      </h2>
      <a href="index.html" class="small-btn add-btn">
        <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16ZM9 5C9 4.44772 8.55228 4 8 4C7.44772 4 7 4.44772 7 5V7H5C4.44772 7 4 7.44771 4 8C4 8.55228 4.44772 9 5 9H7V11C7 11.5523 7.44772 12 8 12C8.55228 12 9 11.5523 9 11V9H11C11.5523 9 12 8.55228 12 8C12 7.44772 11.5523 7 11 7H9V5Z"
          />
        </svg>
        La oss legge til noen filmer!
      </a>
    </div>
    `);
}

document.addEventListener("click", function (event) {
  if (event.target.dataset.add) {
    addFilmToWatchlist(event.target.dataset.add);
  } else if (event.target.dataset.remove) {
    removeFilmFromWatchlist(event.target.dataset.remove);
  }
});

function removeFilmFromWatchlist(ImdbId) {
  const index = myWatchlist.findIndex((film) => film.imdbID === ImdbId);
  myWatchlist.splice(index, 1); //fjerner filmen fra listen
  localStorage.setItem("myWatchlist", JSON.stringify(myWatchlist));
  if (myWatchlistEl) {
    if (filmsFromLocalStorage.length > 0) {
      filmlistHtml = "";
      filmsFromLocalStorage.forEach((film) => {
        addFilmToListHtml(film, filmsFromLocalStorage);
      });
      renderFilmlist(myWatchlistEl, filmlistHtml);
    } else if (filmsFromLocalStorage.length === 0) {
      renderEmptyMyWatchlistMessage();
    }
  } else if (indexPageEl) {
    filmlistHtml = "";
    searchResult.forEach((film) => {
      addFilmToListHtml(film, myWatchlist);
    });
    renderFilmlist(listOfFilmsEl, filmlistHtml);
  }
}

function addFilmToWatchlist(ImdbId) {
  fetch(`https://www.omdbapi.com/?apikey=64994035&i=${ImdbId}`)
    .then((response) => response.json())
    .then((film) => {
      showAsAddedToWatchlist(ImdbId, film);
      myWatchlist.push(film);
      localStorage.setItem("myWatchlist", JSON.stringify(myWatchlist));
    });
}

function addFilmToListHtml(film, arr) {
  //arr er de filmene som skal ha "remove-btn"

  let btnToAddHtml = "";
  let removeBtn = arr.some((filmInArr) => filmInArr.imdbID === film.imdbID);
  if (removeBtn) {
    btnToAddHtml = ` 
      <button class="small-btn remove-btn" data-remove="${film.imdbID}">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16ZM5 7C4.44772 7 4 7.44772 4 8C4 8.55228 4.44772 9 5 9H11C11.5523 9 12 8.55229 12 8C12 7.44772 11.5523 7 11 7H5Z"
          />
        </svg>
        Remove
      </button>`;
  } else {
    btnToAddHtml = `
      <button class="small-btn add-btn" data-add="${film.imdbID}">
        <svg
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16ZM9 5C9 4.44772 8.55228 4 8 4C7.44772 4 7 4.44772 7 5V7H5C4.44772 7 4 7.44771 4 8C4 8.55228 4.44772 9 5 9H7V11C7 11.5523 7.44772 12 8 12C8.55228 12 9 11.5523 9 11V9H11C11.5523 9 12 8.55228 12 8C12 7.44772 11.5523 7 11 7H9V5Z"
          />
        </svg>
        Watchlist
      </button>`;
  }
  return (filmlistHtml +=
    `
        <li class="list-item">
          <img class="poster" src=${film.Poster}/>
          <div class="about-film">
            <div class="first-line">
              <h2>${film.Title}</h2>
              <div class="score">
                <img src="images/star-icon.svg" />
                <p>${film.imdbRating}</p>
              </div>
            </div>
            <div class="second-line">
              <p>${film.Runtime}</p>
              <p>${film.Genre}</p>
              <div data-button-container="${film.imdbID}">` +
    btnToAddHtml +
    `</div>
            </div>
            <p class="excerpt">${film.Plot}</p>
          </div>
        </li>
        `);
}

function showAsAddedToWatchlist(id, film) {
  //film er ett enkelt objekt
  const toggleElement = document.querySelector(
    `[data-button-container="${id}"]`
  );
  toggleElement.innerHTML = `
     <button class="small-btn remove-btn" data-remove="${film.imdbID}">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16ZM5 7C4.44772 7 4 7.44772 4 8C4 8.55228 4.44772 9 5 9H11C11.5523 9 12 8.55229 12 8C12 7.44772 11.5523 7 11 7H5Z"
          />
        </svg>
        Remove
    </button>`;
}

function renderFilmlist(targetElement, listInHtml) {
  targetElement.innerHTML = listInHtml;
  if (targetElement.lastElementChild) {
    targetElement.lastElementChild.style.borderBottom = "none";
    targetElement.lastElementChild.style.paddingBottom = "64px";
  }
}

function showSpinner() {
  searchBtnEl.classList.add("loading");
  searchBtnEl.disabled = true; // Optional: disable the button to prevent multiple clicks
}

function hideSpinner() {
  searchBtnEl.classList.remove("loading");
  searchBtnEl.disabled = false; // Re-enable the button
}
