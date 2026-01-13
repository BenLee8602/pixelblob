import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { CurrentUser, RequireLogin } from "./Auth";
import NavigationBar from "./NavigationBar";
import Home from "./Home";
import Profile from "./Profile";
import ProfileEdit from "./ProfileEdit";
import Login from "./Login";
import Register from "./Register";
import NewPost from "./NewPost";
import Search from "./Search";
import OnePost from "./OnePost";
import Likes from "./Likes";

function App() {
    return (<>
        <BrowserRouter>
            <CurrentUser>
                <NavigationBar />
                <Routes>
                    <Route path="/" element={ <Home/> } />
                    <Route path="/search" element={ <Search/> } />
                    <Route path="/users/:name" element={ <Profile/> } />
                    <Route path="/posts/:id" element={ <OnePost/> } />
                    <Route path="/likes/:id" element={ <Likes/> } />
                    <Route element={ <RequireLogin/> }>
                        <Route path="/new-post" element={ <NewPost/> } />
                        <Route path="/edit-profile" element={ <ProfileEdit/> } />
                    </Route>
                    <Route path="/register" element={ <Register/> } />
                    <Route path="/login" element={ <Login/> } />
                </Routes>
            </CurrentUser>
        </BrowserRouter>
    </>);
}

export default App;
