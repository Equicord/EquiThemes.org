import { useState, useEffect } from "react";
import Image from "next/image";

const ImageWithFallback = ({ src, fallbackSrc, ...props }) => {
    const [imgSrc, setImgSrc] = useState(src);

    useEffect(() => {
        setImgSrc(src);
    }, [src]);

    return <Image alt={"image"} {...props} src={imgSrc} onError={() => setImgSrc(fallbackSrc)} />;
};

export default ImageWithFallback;
