import { useContext } from "react";
import { GlobalVariablesContext } from "../../GlobalVariables";
import { useNavigate } from "react-router-dom";


function UploadFiles() {
  const { setSplatFile, setBoundaryData } = useContext(GlobalVariablesContext);
  const navigate = useNavigate();
  

  const handleSplatFileChange = (e) => {
    setSplatFile(e.target.files[0]);
  };

  const handleColmapFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const jsonData = JSON.parse(event.target.result);
        setBoundaryData(jsonData.vertices.map(([x, z, y]) => ({ x, y, z })))
      };
      reader.readAsText(file);
    }
  };

  const handleUpload = () => {
    navigate('/viewer');
  }

  return (
    <div>
      <div>
        <div>Upload Splat</div>
        <input type="file" onChange={handleSplatFileChange} accept=".splat"/>
      </div>
      <div>
        <div>Upload Colmap</div>
        <input type="file" onChange={handleColmapFileChange} accept=".json"/>
      </div>
      <button onClick={handleUpload}>Upload</button>
    </div>
  );
}

export default UploadFiles;