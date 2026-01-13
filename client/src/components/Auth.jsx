import { createContext, useContext, useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

import { BACKEND_API } from "../config.js"


const UserContext = createContext();

export default function useCurrentUser() {
    return useContext(UserContext);
}


export function RequireLogin() {
    const [curUser] = useCurrentUser();
    return curUser ? <Outlet/> : <Navigate to="/login"/>;
}


export function CurrentUser({ children }) {
    const [curUser, setCurUser] = useState(undefined);
    

    useEffect(() => {
        const refresh = async () => {
            const refreshToken = localStorage.getItem("refreshToken");
            if (!refreshToken) return setCurUser(null);

            const req = {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken })
            };

            try {
                const res = await fetch(`${BACKEND_API}/users/refresh`, req);
                const body = await res.json();
                if (res.status === 200) {
                    localStorage.setItem("accessToken", body.accessToken);
                    return setCurUser(body.user);
                }
                localStorage.removeItem("refreshToken");
                localStorage.removeItem("accessToken");
                setCurUser(null);
                console.log(body);
            } catch (err) { console.log(err); }
        };

        refresh();
        const interval = setInterval(refresh, 870000); // 14:30
        return () => clearInterval(interval);
    }, []);


    if (curUser === undefined) return <></>;

    return <UserContext.Provider value={[curUser, setCurUser]}>
        { children }
    </UserContext.Provider>
}
