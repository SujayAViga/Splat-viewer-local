// make this file a context provider

import { createContext, useState } from 'react';

const GlobalVariablesContext = createContext();

const GlobalVariablesProvider = ({ children }) => {
    const [splatFile, setSplatFile] = useState();
    const [boundaryData, setBoundaryData] = useState();
    

    const contextValue = {
        splatFile,
        setSplatFile,
        boundaryData,
        setBoundaryData
    }

    return <GlobalVariablesContext.Provider value={contextValue}>{children}</GlobalVariablesContext.Provider>
}

export { GlobalVariablesContext, GlobalVariablesProvider };
