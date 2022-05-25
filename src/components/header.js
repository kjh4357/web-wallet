export default function Header() {
  return (
    <header className="absolute w-full px-10 py-5 bg-white">
      <h1 className="flex items-center justify-start">
        <div className="box-content flex items-center justify-center w-10 h-10 p-3 rounded-full loa-gradient">
          <img src="/img/ico_logo.svg" alt="" />
        </div>
        <em className="ml-5 text-3xl not-italic font-bold">LOA LAND</em>
      </h1>
      <div></div>
    </header>
  );
}
