import { useContent } from "@/providers/content-context";
import { useState } from "react";
import { FaSearch } from "react-icons/fa";

export const TrailsPgTop = ({
  searchTerm,
  setSearchTerm,
}: {
  searchTerm: string;
  setSearchTerm: any;
}) => {
  const filterCategories = [
    {
      text: "Biruleibe",
      isChecked: false,
    },
  ];

  return (
    <div className="flex w-full items-center md:flex-row flex-col gap-3">
      <p className="font-bold lg:text-3xl text-2xl text-center text-nowrap md:order-first order-last">
        Trilhas de aprendizagem
      </p>
      <div className="flex flex-row w-full items-center content-center md:justify-center justify-between gap-2">
        <label className="input input-bordered flex items-center gap-2 lg:w-2/4 w-full bg-white rounded-box">
          <input
            type="text"
            className="grow bg-cgrey text-dgray text-xs md:text-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquise a sua Trilha"
          />

          <FaSearch className="w-5 h-5 text-gray" />
        </label>
        <div className="dropdown dropdown-end ">
          <div
            tabIndex={0}
            role="button "
            className="btn m-1 bg-neutralbg md:text-md text-xs rounded-box input-bordered hover:bg-neutralbg"
          >
            Filtros
          </div>
          <div
            tabIndex={0}
            className="dropdown-content bg-neutralbg rounded-box z-[1] w-52 h-fit flex flex-col gap-1 p-2 shadow text-neutral"
          >
            <div className="flex w-full h-10 hover:cursor-pointer hover:bg-cgray items-center justify-between px-4 rounded-lg">
              <a className="w-fit">Biruleibe</a>
              <input
                type="checkbox"
                className="checkbox [--chkbg:theme(colors.ddblue)] [--chkfg:white]"
              />
            </div>
            <div className="flex w-full h-10 hover:cursor-pointer hover:bg-cgray items-center justify-between px-4 rounded-lg">
              <a className="w-fit">Biruleibe2</a>
              <input
                type="checkbox"
                className="checkbox [--chkbg:theme(colors.ddblue)] [--chkfg:white]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
