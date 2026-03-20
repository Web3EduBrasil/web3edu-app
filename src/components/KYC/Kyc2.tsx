import Image from "next/image";
import web3EduLogo from "../../../public/assets/images/Web3EduBrasil_logo.png";
import { MotionButton } from "../ui/Button";
import { toast } from "react-toastify";
import { Kyc2Props, Interests } from "@/interfaces/interfaces";

export default function Kyc2({
  handleTabClick,
  interests,
  setInterests,
  fetchKyc,
}: Kyc2Props<void>) {
  const handleCheckboxChange = (key: keyof Interests) => {
    if (setInterests) {
      setInterests((prev) => ({
        ...prev,
        [key]: !prev[key],
      }));
    }
  };

  return (
    <div className="flex-col flex w-full h-full justify-between">
      <div>
        <h2 className="sr-only">Steps</h2>

        <div>
          <p className="text-xs font-medium text-gray">2/2 - Perguntas</p>

          <div className="mt-4 overflow-hidden rounded-full h-1 bg-dgray/20 mb-1">
            <div className="h-1 w-full rounded-full bg-cgreen"></div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 mt-2 justify-between">
        <div>
          <h3 className="text-xl font-medium text-neutral">
            Quais são os seus maiores interesses?{" "}
          </h3>

          <div className="flow-root"></div>
        </div>
        <Image alt="ss" src={web3EduLogo} className="w-16 h-12 object-fill" />
      </div>

      <ul className="mt-4 space-y-2 pb-5">
        <fieldset className="space-y-4">
          <legend className="sr-only">Interests</legend>

          <div className="form-control rounded-box border border-dgray cursor-pointer hover:border-dgreen hover:ring-1">
            <label
              htmlFor="crypto-checkbox"
              className="label cursor-pointer h-full w-full p-4"
            >
              <span className="label-text font-medium text-dblue">
                Criptomoedas
              </span>
              <input
                type="checkbox"
                id="crypto-checkbox"
                checked={interests?.crypto}
                onChange={() => handleCheckboxChange("crypto")}
                className="checkbox checkbox-dblue"
              />
            </label>
          </div>

          <div className="form-control rounded-box border border-dgray cursor-pointer hover:border-dgreen hover:ring-1">
            <label
              htmlFor="blockchain-checkbox"
              className="label cursor-pointer p-4"
            >
              <span className="label-text font-medium text-dblue">
                Blockchain
              </span>
              <input
                type="checkbox"
                id="blockchain-checkbox"
                checked={interests?.blockchain}
                onChange={() => handleCheckboxChange("blockchain")}
                className="checkbox checkbox-dblue"
              />
            </label>
          </div>

          <div className="form-control rounded-box border border-dgray cursor-pointer hover:border-dgreen hover:ring-1">
            <label htmlFor="rwa-checkbox" className="label cursor-pointer p-4">
              <span className="label-text font-medium text-dblue">RWA</span>
              <input
                type="checkbox"
                id="rwa-checkbox"
                checked={interests?.rwa}
                onChange={() => handleCheckboxChange("rwa")}
                className="checkbox checkbox-dblue"
              />
            </label>
          </div>

          <div className="form-control rounded-box border border-dgray cursor-pointer hover:border-dgreen hover:ring-1">
            <label
              htmlFor="smartcontracts-checkbox"
              className="label cursor-pointer p-4"
            >
              <span className="label-text font-medium text-dblue">
                Smart Contracts
              </span>
              <input
                type="checkbox"
                id="smartcontracts-checkbox"
                checked={interests?.smartcontracts}
                onChange={() => handleCheckboxChange("smartcontracts")}
                className="checkbox checkbox-dblue"
              />
            </label>
          </div>

          <div className="form-control rounded-box border border-dgray cursor-pointer hover:border-dgreen hover:ring-1">
            <label htmlFor="defi-checkbox" className="label cursor-pointer p-4">
              <span className="label-text font-medium text-dblue">DeFi</span>
              <input
                type="checkbox"
                id="defi-checkbox"
                checked={interests?.defi}
                onChange={() => handleCheckboxChange("defi")}
                className="checkbox checkbox-dblue"
              />
            </label>
          </div>
        </fieldset>
      </ul>
      <div className="w-full justify-center flex">
        <MotionButton
          label="Enviar"
          type="button"
          func={() =>
            toast.promise(fetchKyc(), {
              pending: "Enviando...",
              success: "Formulário enviado com sucesso!",
              error: "Erro ao enviar formulário.",
            })
          }
          className="bg-cgreen w-3/5 text-neutral font-semibold"
        />
      </div>
    </div>
  );
}
