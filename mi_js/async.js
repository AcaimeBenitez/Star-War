const apiURL = 'https://www.swapi.tech/api/films';
let filmsPromise = null;
const moviePromises = {};

const fetchFilms = () => {
  if (!filmsPromise) {
    filmsPromise = fetch(apiURL)
      .then(res => res.json())
      .catch(() => null);
  }
  return filmsPromise;
};


//Ejercicio1
export const getMovieCount = async () => {
  const data = await fetchFilms();

  return data?.total_records ?? data?.result?.length;
};

//Ejercicio2
export const listMovies = async () => {
    const data = await fetchFilms();

  return (
    data?.result?.map(movie => ({
      id: movie.uid,
      name: movie.properties?.title,
      director: movie.properties?.director,
      episodeID: movie.properties?.episode_id
    })) ?? []
  );
};

//Ejercicio3
export const listMoviesSorted = async () => {
  const movies = await listMovies();

  return movies
    .map(movie => movie.name)
    .filter(Boolean)
    .sort();
};

//Ejercicio4
export const listEvenMoviesSorted = async () => {
  const movies = await listMovies();

  return movies
    .filter(movie => Number(movie.episodeID) % 2 === 0)
    .sort((a, b) => a.episodeID - b.episodeID);
};

//Llamada de caché para las películas individuales (5.1)
const fetchMovieById = (id) => {
  if (!moviePromises[id]) {
    moviePromises[id] = fetch(`${apiURL}/${id}`)
      .then(res => res.json())
      .catch(() => null);
  }
  return moviePromises[id];
};


//Ejercicio 5.1
export const getMovieInfo = async (id) => {
  const data = await fetchMovieById(id);

  return {
    name: data?.result?.properties?.title,
    episodeID: data?.result?.properties?.episode_id,
    director: data?.result?.properties?.director,
    release: data?.result?.properties?.release_date,
    characters: data?.result?.properties?.characters ?? []
  };
};

//(5.2)
const characterPromises = {};

const fetchCharacter = (url) => {
  if (!characterPromises[url]) {
    characterPromises[url] = fetch(url)
      .then(res => res.json())
      .catch(() => null);
  }
  return characterPromises[url];
};

// Ejercicio 5.2
export const getCharacterName = async (characterUrl) => {
  const data = await fetchCharacter(characterUrl);

  return data?.result?.properties?.name;
};

// Ejercicio 5.3
export const getMovieCharacters = async (id) => {
  const movie = await getMovieInfo(id);

  const characterPromises = movie.characters.map(url =>
    getCharacterName(url)
  );

  return Promise.all(characterPromises);
};

// Ejercicio 6
export const getMovieCharactersAndHomeworlds = async (id) => {
  const movie = await getMovieInfo(id);

  const characters = [];

  for (const characterUrl of movie.characters) {
    // Personaje
    const characterResponse = await fetch(characterUrl).catch(() => null);
    const characterData = await characterResponse?.json();

    const name = characterData?.result?.properties?.name;
    const homeworldUrl = characterData?.result?.properties?.homeworld;

    // Planeta
    const homeworldResponse = await fetch(homeworldUrl).catch(() => null);
    const homeworldData = await homeworldResponse?.json();

    characters.push({
      name,
      homeworld: homeworldData?.result?.properties?.name
    });
  }

  return {
    episodeID: movie.episodeID,
    name: movie.name,
    characters
  };
};

// Ejercicio 7
export class Movie {
  constructor(id) {
    this.id = id;
  }

  async getInfo() {
    return getMovieInfo(this.id);
  }

  async getCharacters() {
    return getMovieCharacters(this.id);
  }

  async getCharactersAndHomeworlds() {
    return getMovieCharactersAndHomeworlds(this.id);
  }
}
