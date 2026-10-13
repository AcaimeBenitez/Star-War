import {
    setMovieHeading,
    initMovieSelect,
    setMovieSelectCallbacks,
    handleMovieChangeExtras
} from './dom.js';

setMovieHeading(1, ".movie__title", ".movie__info", ".movie__director");
initMovieSelect('#movie');
setMovieSelectCallbacks(
  '#movie',
  '.movie__title',
  '.movie__info',
  '.movie__director'
);










//PRUEBA DE ASYNC
// import {
//     getMovieCount,
//     listMovies,
//     listMoviesSorted,
//     listEvenMoviesSorted,
//     getMovieCharacters, 
//     getMovieCharactersAndHomeworlds,
//     Movie
// } from './async.js';

// (async () => {
//     try {
//          const total = await getMovieCount();
//         console.log(`Ej1: Películas encontradas: ${total}`);

//         const movies = await listMovies();
//         console.log(`Ej2: Películas: ${movies}`);

//         const titles = await listMoviesSorted();
//         console.log(`Ej3: Títulos ordenados: ${titles}`);

//         const evenMovies = await listEvenMoviesSorted();
//         console.log('Ej4: Películas pares ordenadas:', evenMovies);

//         const characters = await getMovieCharacters('1'); 
//         console.log('Ej5 Personajes:', characters);

//         const movieData = await getMovieCharactersAndHomeworlds(1);
//         console.log(movieData);*/

//         const movie = new Movie(1);
//         console.log(await movie.getInfo());
//         console.log(await movie.getCharacters());
//         console.log(await movie.getCharactersAndHomeworlds());

//     } catch (error) {
//         console.error(error);
//     }
// })();