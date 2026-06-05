'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const FavoriteContext = createContext();

export function FavoriteProvider({ children }) {
  const [favorites, setFavorites] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('akabir-favorites');
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch (e) {
        setFavorites([]);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('akabir-favorites', JSON.stringify(favorites));
    }
  }, [favorites, isLoaded]);

  const addFavorite = (book) => {
    setFavorites(prev => {
      if (prev.some(item => item.id === book.id)) return prev;
      return [...prev, book];
    });
  };

  const removeFavorite = (id) => {
    setFavorites(prev => prev.filter(item => item.id !== id));
  };

  const isFavorite = (id) => {
    return favorites.some(item => item.id === id);
  };

  const toggleFavorite = (book) => {
    if (isFavorite(book.id)) {
      removeFavorite(book.id);
    } else {
      addFavorite(book);
    }
  };

  return (
    <FavoriteContext.Provider value={{
      favorites,
      addFavorite,
      removeFavorite,
      isFavorite,
      toggleFavorite,
      isLoaded
    }}>
      {children}
    </FavoriteContext.Provider>
  );
}

export const useFavorites = () => useContext(FavoriteContext);
