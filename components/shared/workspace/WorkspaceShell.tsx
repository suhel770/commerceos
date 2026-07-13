"use client";

import { ReactNode } from "react";

interface WorkspaceShellProps {

    header:ReactNode;

    tabs:ReactNode;

    children:ReactNode;

    banner?:ReactNode;

}

export default function WorkspaceShell({

    header,

    tabs,

    banner,

    children,

}:WorkspaceShellProps){

    return(

        <div className="space-y-6">

            {header}

            {banner}

            <div
                className="
                    sticky
                    top-0
                    z-30
                    rounded-3xl
                    bg-white/90
                    backdrop-blur-xl
                "
            >

                {tabs}

            </div>

            <section>

                {children}

            </section>

        </div>

    );

}