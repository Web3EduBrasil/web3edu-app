import web3EduLogo from "../../images/Web3EduBrasil_logo.png";
import Image from "next/image";

const Header = () => {
  return (
    <header className="bg-white text-black flex justify-between items-center z-10 fixed w-screen px-10 h-[10vh]">
      <div className="text-lg font-bold flex items-center gap-5">
        <Image src={web3EduLogo} alt="" className="h-9 w-auto" />
        <p className="text-[#15457b]">Web3EduBrasil</p>
      </div>

      <button className="border-2 bg-[#21a46f] text-white	w-28 h-12 rounded-2xl">
        Go to App
      </button>
    </header>
  );
};

export default Header;
