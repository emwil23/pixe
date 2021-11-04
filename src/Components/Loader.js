import React from 'react';

export const Loader = () => {
  return (
    <div className='Loading' style={{ textAlign: 'center' }}>
      <div class='lds-ellipsis'>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
  );
};
