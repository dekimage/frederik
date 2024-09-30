import { LargeTitle, ReelsSection } from "../page";

const ReelsPage = () => {
  return (
    <div className="bg-black text-white w-full min-h-[1000px] pt-16 flex flex-col justify-center items-center">
      <div className="flex flex-col w-full justify-center items-center px-4 sm:px-8">
        <ReelsSection />
      </div>
    </div>
  );
};
export default ReelsPage;
