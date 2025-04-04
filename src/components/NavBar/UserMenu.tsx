import { useWeb3AuthContext } from "@/lib/web3auth/Web3AuthProvider";
import { useRouter } from "next/navigation";
import { CgProfile } from "react-icons/cg";
import { IoWalletOutline } from "react-icons/io5";

export const UserMenu = () => {
  const { googleUserInfo, logout, userInfo, WalletUi } = useWeb3AuthContext();
  const router = useRouter();

  return (
    <div className="flex flex-row justify-self-end items-center gap-2">
      <div
        tabIndex={0}
        role="button"
        className="btn btn-ghost btn-circle avatar flex items-center justify-center"
        onClick={WalletUi}
      >
        {userInfo ? (
          <IoWalletOutline
            className="w-8 h-8 black content-center"
            style={{ color: "black" }}
          />
        ) : null}
      </div>
      <div className="dropdown dropdown-end">
        <div
          tabIndex={1}
          role="button"
          className="btn btn-ghost btn-circle avatar"
        >
          <div className="w-9 rounded-full">
            {userInfo ? (
              <img alt="User Image" src="https://imgs.search.brave.com/6S8yL0z8CMzh1LhUnKButQCb0KnA0XL2goUeqmeI6mE/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pbWFn/ZXMudGNkbi5jb20u/YnIvaW1nL2ltZ19w/cm9kLzgxL2FwbGlx/dWVfZGVfcGFyZWRl/X2RlY29yYXRpdm9f/ZW1fbWRmX2FsZmFi/ZXRvX2xldHJhX21f/NjUwMjlfMV82MTUz/YWQ3MTA2NjkxZDNj/NWE2MGJhMmNmMzFi/NjlmOS5qcGc" />
            ) : (
              <CgProfile className="w-9 h-9" />
            )}
          </div>
        </div>
        <ul
          tabIndex={0}
          className="menu menu-md dropdown-content bg-neutralbg rounded-box z-[1] mt-1 w-52 p-2 shadow py-2 text-neutral"
        >
          <li>
            <a onClick={() => router.push("/userPage")}>Perfil</a>
          </li>
          <li>
            <a onClick={() => router.push("/onboarding")}>Ajuda</a>
          </li>

          <li>
            <a onClick={logout}>Sair</a>
          </li>
        </ul>
      </div>
    </div>
  );
};