import React, { useEffect, useRef, useState } from 'react';
import ImageCard from './ImageCard';

const ImageList = (props) => {
  const [noImages, setNoImages] = useState(false);
  const firstRender = useRef(true);

  const images = props.images.map((image) => {
    return <ImageCard key={image.id} image={image} />;
  });

  useEffect(() => {
    if (firstRender.current) return (firstRender.current = false);

    if (props.images.length === 0) return setNoImages(true);
    else setNoImages(false);
  }, [props.images]);

  return (
    <div className='image__container'>
      <div className='image-list'>{images}</div>
      <div className='image-emptyList'>
        {noImages ? 'NO IMAGES FOUND!' : null}
      </div>
    </div>
  );
};

export default ImageList;
