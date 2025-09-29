import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from '@reduxjs/toolkit';
import candidatesReducer from './candidatesSlice';
import interviewReducer from './interviewSlice';
import uiReducer from './uiSlice';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['candidates', 'interview'] // Only persist these slices
};

const rootReducer = combineReducers({
  candidates: candidatesReducer,
  interview: interviewReducer,
  ui: uiReducer
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE']
      }
    })
});

export const persistor = persistStore(store);