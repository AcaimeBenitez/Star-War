import {
    getMovieInfo,
    listMovies,
    getMovieCharactersAndHomeworlds 
} from './async.js';

//Ejercicio 1
export async function setMovieHeading(
    movieId,
    titleSelector,
    infoSelector,
    directorSelector
) {
    const movie = await getMovieInfo(movieId);
    if (!movie) return;

    const titleEl = document.querySelector(titleSelector);
    const infoEl = document.querySelector(infoSelector);
    const directorEl = document.querySelector(directorSelector);

    if (!titleEl || !infoEl || !directorEl) return;

    titleEl.innerHTML = movie.name;
    infoEl.innerHTML = `Episode ${movie.episodeID} - ${movie.release}`
    directorEl.innerHTML = `Director: ${movie.director}`;
}

// Ejercicio 2
export async function initMovieSelect(selectSelector) {
    const selectEl = document.querySelector(selectSelector);
    if (!selectEl) return;

    selectEl.innerHTML = '';

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select a movie';
    selectEl.appendChild(defaultOption);

    const movies = await listMovies();

    movies.forEach(movie => {
        const option = document.createElement('option');
        option.value = movie.id;
        option.textContent = movie.name;
        selectEl.appendChild(option);
    });
}

// Ejercicio 3
export function setMovieSelectCallbacks(
    selectSelector,
    titleSelector,
    infoSelector,
    directorSelector
) {
    const selectEl = document.querySelector(selectSelector);
    if (!selectEl) return;

    selectEl.addEventListener('change', async () => {
        const movieId = selectEl.value;

        if (!movieId) {
            document.querySelector(titleSelector).innerHTML = '';
            document.querySelector(infoSelector).innerHTML = '';
            document.querySelector(directorSelector).innerHTML = '';
            return;
        }

        await setMovieHeading(
            movieId,
            titleSelector,
            infoSelector,
            directorSelector
        );
    });
}