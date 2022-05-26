import react from "react";
import useIPFS from '../hooks/useIPFS'

const IPFSDownload = ({hash, fileName})=>{

    const file = useIPFS(hash, fileName);

    return(
<div>
        {file?
        (
            <div className="download-component">
                <a className="download-button" href={file} download={fileName}>Download</a>
                </div>
        ):(
            <p>Downloading file...</p>
        )}
</div>
    );
}

export default IPFSDownload;