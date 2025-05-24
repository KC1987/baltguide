import { db } from "@/config/firebase";
import { collection, getDoc, getDocs, limit, query, where } from "firebase/firestore";


export default async function Page({ params }:any) {
  const { slug } = await params;

  const collectionRef = collection( db, "locations" );
  const q = query( collectionRef, where("slug", "==", slug), limit(1) );

  const locationData = await getDocs(q);
  const location = locationData.docs.map(doc => doc.data()) [0];

  return (
    <section  >
      <div className="flex max-sm:flex-col gap-2" >
        <div className="bg-emerald-600 rounded-md lg:w-2/3 md:w-1/2 w-full  h-96 p-2" >
          <h1 className="text-xl text-white">Pictures</h1>
        </div>  
        <div className="bg-slate-200 mx-auto rounded-md lg:w-1/3 md:w-1/2 w-full h-96">
          <h1 className="text-2xl font-semibold text-gray-700 text-center p-2" >{location.name}</h1>
          { location.wifi?.map( (option, i) => <p key={i}>{option}</p>) }
        </div>
      </div>
      <div className="bg-sky-300 rounded-md min-h-screen my-2 p-2" >
        <h1 className="text-xl text-white" >Description</h1>
      </div>

    </section>
  )
}