"use client";

import {
  RefreshCw,
  Download,
  Filter,
  Search,
} from "lucide-react";

interface WorkspaceToolbarProps {

  title?: string;

}

export default function WorkspaceToolbar({

  title,

}: WorkspaceToolbarProps){

  return(

    <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">

      <div>

        {title && (

          <h2 className="text-xl font-bold">

            {title}

          </h2>

        )}

      </div>

      <div className="flex items-center gap-3">

        <button className="rounded-xl border border-slate-200 p-3 hover:bg-slate-50">

          <Search size={18}/>

        </button>

        <button className="rounded-xl border border-slate-200 p-3 hover:bg-slate-50">

          <Filter size={18}/>

        </button>

        <button className="rounded-xl border border-slate-200 p-3 hover:bg-slate-50">

          <RefreshCw size={18}/>

        </button>

        <button className="rounded-xl border border-slate-200 p-3 hover:bg-slate-50">

          <Download size={18}/>

        </button>

      </div>

    </div>

  );

}