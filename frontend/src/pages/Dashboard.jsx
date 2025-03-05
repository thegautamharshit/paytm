import { useEffect, useState } from "react"
import { Appbar } from "../components/Appbar"
import { Balance } from "../components/Balance"
import { Users } from "../components/Users"
import axios from "axios"

export const Dashboard = () => {
    const [balance, setBalance] = useState(null);
    const [name, setName] = useState(null);

    useEffect(()=>{
        const fetchbalance = async ()=>{
            try{
                const token = localStorage.getItem("token");
                const response = await axios.get("http://localhost:3000/api/v1/account/balance",{
                    headers: {Authorization: `Bearer ${token}`}
                })
                setBalance(response.data.balance);
            }catch(error){
                console.error("Failed to fetch balance:", error);
                setBalance("Error");
            }
        }

        fetchbalance();
    },[]);

    useEffect(()=>{
        const fetchName = async()=>{
            try{
                const token = localStorage.getItem("token");
                const response = await axios.get("http://localhost:3000/api/v1/user/me",{
                    headers: {Authorization: `Bearer ${token}`}
                })
                setName(response.data.firstName +" "+ response.data.lastName);
            }catch{
                console.error("Failed to fetch Name:", error);
                setBalance("Error");
            }
        }

        fetchName();
    })

    return <div>
        <Appbar fullname={name !== null ? name: "User"}/>
        <div className="m-8">
            <Balance value={balance !== null ? balance.toString(): "Loading"} />
            <Users />
        </div>
    </div>
}