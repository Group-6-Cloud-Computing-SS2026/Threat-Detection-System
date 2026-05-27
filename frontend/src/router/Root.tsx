import { Outlet } from "react-router";

export default function Root() {
    return (
        <main id="app">
            <Outlet />
        </main>
    );
}
