import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
    return (
        <div className="min-h-screen bg-gray-950">
            <Navbar />
            <main className="max-w-7xl mx-auto px-3 sm:px-6 pb-6 pt-2">
                <Outlet />
            </main>
        </div>
    );
}
