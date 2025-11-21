import { configureStore } from "@reduxjs/toolkit";
import loginSliceReducer from "./slice/loginSlice";


const store = configureStore({
    reducer: {
        login: loginSliceReducer,
    }
})

export default store;