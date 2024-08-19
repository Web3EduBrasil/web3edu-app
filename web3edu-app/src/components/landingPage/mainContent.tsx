import web3EduLogo from "../../images/Web3EduBrasil_logo.png";
import MainFunctions from "./mainFunctions";
import Image from "next/image";
import UserDocIcon from "../../images/user-doc-icon.svg";
import ForumIcon from "../../images/forum-icon.svg";
import TrailIcon from "../../images/trail-icon.svg";
import TrailCard from "./trails";

const MainContent = () => {
  return (
    <div className="h-full w-full pt-[10vh] flex flex-col justify-center items-center">
      <div className="flex h-5/6 justify-center items-center">
        <section className="flex flex-col text-center py-20 px-20 w-3/5 text-black h-full z-0 overflow-auto justify-center items-center relative">
          <h1 className="text-5xl font-bold text-justify">
            Transforme Conhecimento em Oportunidades de Crescimento
          </h1>
          <p className="mt-4 text-lg text-justify">
            Explore nossos recursos educacionais abrangentes para entender como
            as criptomoedas funcionam e porque a tokenização de ativos está
            transformando diversos setores.
          </p>
        </section>
        <div className="flex w-2/5 h-full justify-center items-center">
          <Image src={web3EduLogo} alt="" className="w-60" />
        </div>
      </div>
      <div className="overflow-x-hidden w-full">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320 ">
          <path
            fill="#fcedb2"
            fill-opacity="1"
            d="M0,64L60,58.7C120,53,240,43,360,53.3C480,64,600,96,720,133.3C840,171,960,213,1080,197.3C1200,181,1320,107,1380,69.3L1440,32L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
          ></path>
        </svg>
        <div className="h-[60vh] bg-[#fcedb2] flex justify-center items-center flex-col">
          <p className="text-4xl font-bold text-black">Principais Funções</p>
          <div className="h-4/5 flex justify-evenly items-center w-screen px-10">
            <MainFunctions
              functionName={"Sistema de Recompensas"}
              content={
                "Texto Sistema de Recompensas Texto Sistema de Recompensas Texto Sistema de Recompensas Texto Sistema de Recompensas"
              }
              image={UserDocIcon}
            />
            <MainFunctions
              functionName={"Fórum Colaborativo"}
              content={
                "Nós oferecemos um fórum para que nossos usuários possam compartilhar experiências e relatos sobre blockchain"
              }
              image={ForumIcon}
            />
            <MainFunctions
              functionName={"Trilhas de Aprendizagem"}
              content={
                "Texto Trilhas de Aprendizagem Texto Trilhas de Aprendizagem Texto Trilhas de Aprendizagem Texto Trilhas de Aprendizagem "
              }
              image={TrailIcon}
            />
          </div>
        </div>
      </div>
      <div className="h-[60vh] flex w-full p-14">
        <div
          className="flex flex-col text-black justify-around
         items-left w-2/4"
        >
          <div className="flex flex-col">
            <div className="w-full flex">
              <p className="font-bold whitespace-pre-wrap">
                Acessando o Futuro com a{" "}
              </p>
              <p className="font-bold text-[#21a16b]"> Web3EduBrasil</p>
            </div>
            <p className="whitespace-pre-wrap"> </p>
            <p className="font-bold text-4xl">Explore a Plataforma</p>
            <p className="whitespace-pre-wrap"> </p>
            <p>
              Veja a seguir as nossas principais funções presentes em nosso
              site. Aprenda as principais coisas do mundo do Web3!
            </p>
          </div>

          <div className="flex w-5/6 border-2 h-1/6 rounded-full p-2 justify-between">
            <div className="flex w-[30%] bg-[#fcedb2] rounded-full items-center gap-2 justify-center">
              <Image
                src={UserDocIcon}
                alt=""
                className="w-2/12 justify-self-start"
              />
              <p>Tokens</p>
            </div>
            <div className="flex w-[30%] bg-[#fcedb2] rounded-full items-center gap-2 justify-center">
              <Image
                src={ForumIcon}
                alt=""
                className="w-2/12 justify-self-start"
              />
              <p>Fórum</p>
            </div>
            <div className="flex w-[30%] bg-[#fcedb2] rounded-full items-center gap-2 justify-center">
              <Image
                src={TrailIcon}
                alt=""
                className="w-2/12 justify-self-start"
              />
              <p>Trilhas</p>
            </div>
          </div>
        </div>
        <div className="w-2/4 flex justify-center items-center"></div>
      </div>
      <div className="h-[80vh] flex flex-col w-4/5 px-14 items-center">
        <div className="flex flex-col justify-center items-center text-black w-4/5 h-2/5 text-justify">
          <p className="text-4xl font-semibold	">Trilhas de aprendizagem</p>
          <br></br>
          <p>
            Explore conteúdos detalhados sobre esses temas fascinantes e amplie
            seu conhecimento sobre o universo digital das finanças e tecnologia.
            Seja bem-vindo à sua jornada de aprendizado conosco!
          </p>
        </div>
        <div className="flex w-full h-3/6 flex-wrap justify-center gap-10">
          <TrailCard trailName={"Criptomoedas"} image={TrailIcon} />
          <TrailCard trailName={"Criptomoedas"} image={TrailIcon} />
          <TrailCard trailName={"Criptomoedas"} image={TrailIcon} />
          <TrailCard trailName={"Criptomoedas"} image={TrailIcon} />
          <TrailCard trailName={"Criptomoedas"} image={TrailIcon} />
        </div>
      </div>
    </div>
  );
};

export default MainContent;
