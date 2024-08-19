import Image from "next/image";

function MainFunctions({
  functionName,
  content,
  image,
}: {
  functionName: any;
  content: any;
  image: any;
}) {
  return (
    <div className="bg-[#F3F3F3] text-black flex justify-between items-center w-72 h-4/5 rounded-3xl flex-col">
      <div className="h-2/5 w-full flex drop-shadow-2xl">
        <div className="w-2/5 h-full rounded-l-3xl flex justify-center">
          <Image src={image} alt="" className="w-4/6" />
        </div>
        <div className="w-3/5 h-full bg-[#001D3D] rounded-r-3xl flex justify-center items-center text-center">
          <p className="text-white">{functionName}</p>
        </div>
      </div>
      <div className="flex flex-col justify-center items-center h-3/5 w-full">
        <p className="text-wrap px-5 h-4/5 overflow-x-hidden">{content}</p>
        <div className="bg-black w-4/5 h-px"></div>
      </div>
    </div>
  );
}

export default MainFunctions;
