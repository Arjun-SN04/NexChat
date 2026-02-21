import React from 'react'
import { useEffect } from 'react'
import { useState } from 'react'
import Cookies from "js-cookie"
import axios from "axios"
const useGetAllUsers = () => {
    const [allUser, setallUser] = useState([])
    const [loading, setloading] = useState(false)
    useEffect( ()=>{
        const getUser = async()=>{
            setloading(true)
            try {
                const token = Cookies.get("jwt")
              const response =   await axios.get("/api/user/allusers",
                    {withCredentials :true  ,headers:{Authorization :`Bearer ${token}`} })
                setallUser(response.data.allUsers)
                setloading(false)
            } catch (error) {
                console.log(error);
                
            }
        }
        getUser()
    },[] )  
    return [allUser,loading]
  
}

export default useGetAllUsers
