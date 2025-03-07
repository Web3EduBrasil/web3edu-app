import { useWeb3AuthContext } from "@/lib/web3auth/Web3AuthProvider";
import { useRouter } from "next/navigation";
import { CgProfile } from "react-icons/cg";
import { IoWalletOutline } from "react-icons/io5";

export const UserMenu = () => {
  const { googleUserInfo, logout, isLoggedIn } = useWeb3AuthContext();
  const router = useRouter();

  return (
    <div className="flex flex-row justify-self-end items-center gap-2">
      <div
        tabIndex={0}
        role="button"
        className="btn btn-ghost btn-circle avatar flex items-center justify-center"
        onClick={undefined} //remove wallet or it should pop the wallet extension
      >
        {isLoggedIn ? (
          <IoWalletOutline
            className="w-9 h-9 black content-center"
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
          <div className="w-10 rounded-full">
            {isLoggedIn ? (
              <img alt="User Image" src={googleUserInfo?.photoURL} fetchPriority="high" />
            ) : (
              <CgProfile className="w-10 h-10" />
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
            <a onClick={logout}>Sair</a>
          </li>
        </ul>
      </div>
    </div>
  );
};
