"use client";

import React, { useEffect } from "react";

import AOS from "aos";
import "aos/dist/aos.css";
import Footer from "../../shared/components/ui/footer.tsx";

export default function HomeLayout({
                                          children,
                                      }: {
    children: React.ReactNode;
}) {
    useEffect(() => {
        AOS.init({
            once: true,
            disable: "phone",
            duration: 600,
            easing: "ease-out-sine",
        });
    });

    return (
        <>
            <main className="relative flex grow flex-col">{children}</main>

            <Footer />
        </>
    );
}
