import React, { useEffect, useRef, useState } from "react";

import { BACKEND_API } from "../config.js";
import useCurrentUser from "./Auth";


function BigList({ route, req = undefined, map, container = null }) {
    const [user] = useCurrentUser();
    const [data, setData] = useState([]);
    const [good, setGood] = useState(true);
    const [page, setPage] = useState(0);
    const [start, setStart] = useState(Date.now());

    const pageRef = useRef(page);
    const goodRef = useRef(good);
    const bottom = useRef(null);

    useEffect(() => { pageRef.current = page }, [page]);
    useEffect(() => { goodRef.current = good }, [good]);


    const loadMore = async () => {
        if (!goodRef.current) return;
        setGood(false);
        try {
            const url = `${BACKEND_API}/${route}?page=${pageRef.current}&start=${start}`;
            const res = await fetch(url + (user ? `&cur=${user.id}` : ``), req);
            const body = await res.json();
            if (res.status !== 200 || body.length === 0) return setGood(false);
            setPage(prev => prev + 1);
            setData(prev => [...prev, ...body]);
        } catch (err) { console.log(err); }
        setGood(true);
    };


    useEffect(() => {
        const observer = new IntersectionObserver(entries => {
            for (const entry of entries) {
                if (entry.isIntersecting) loadMore();
            }
        }, {
            root: container,
            rootMargin: "0px",
            threshold: 0.1
        });

        if (bottom.current) observer.observe(bottom.current);
        return () => {
            if (bottom.current) observer.unobserve(bottom.current);
        };
    }, []);


    return (<>
        { data.map(map) }
        <div ref={bottom} style={{"height": "1px"}}></div>
    </>);
}


export default BigList;
