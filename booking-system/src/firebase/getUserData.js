import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import {auth} from "./firebase";





 const getData = async()=>{
    const docRef = doc(db, "users", 'kICd6NcL9GBOxGRwmXeJ');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
        
        if(docSnap.data()['role']){
            return 'user';
        }


    } else {
    // docSnap.data() will be undefined in this case
        return;
    }

};

export default getData;


