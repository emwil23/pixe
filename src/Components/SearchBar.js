import React from 'react';

import EW from '../img/EWpro.jpg';
import sprite from '../img/sprite.svg';

class SearchBar extends React.Component {
  state = { term: '' };

  onFormSubmit = (event) => {
    event.preventDefault();

    this.props.onSubmit(this.state.term);
    document.getElementById('input__focus').blur();
  };

  componentDidMount() {
    document.getElementById('input__focus').focus();
  }

  render() {
    return (
      <div className='container__search'>
        <form onSubmit={this.onFormSubmit} className='form'>
          <input
            id='input__focus'
            className='form__input'
            type='text'
            placeholder='Search for images'
            value={this.state.term}
            onChange={(event) => {
              this.setState({ term: event.target.value.toUpperCase() });
            }}
          />
        </form>
        <div className='dev'>
          <img
            className='dev--icon'
            src={EW}
            alt='my profile'
            onClick={() => {
              if (
                document.getElementById('nav_bg').style.transform ===
                'scale(150)'
              ) {
                document.getElementById('nav_bg').style.transform = 'scale(1)';
                document.getElementById('navi').style.opacity = '0';
                document.getElementById('navi').style.visibility = 'hidden';
              } else {
                document.getElementById('nav_bg').style.transform =
                  'scale(150)';
                document.getElementById('navi').style.opacity = '1';
                document.getElementById('navi').style.visibility = 'visible';
              }
            }}
          />
          <div className='dev__background' id='nav_bg'>
            &nbsp;
          </div>
          <div className='dev__nav' id='navi'>
            <div className='dev__nav--1'>
              <div className='dev__nav--1-title'>Emmanuel Wilson</div>
              <div className='dev__nav--1-sub'>
                A develpoper with an artistic approch.
              </div>
            </div>
            <div className='dev__nav--2'>
              <svg className='dev__nav--2-icon__git'>
                <use xlinkHref={sprite + '#icon-github'} />
              </svg>
              <svg className='dev__nav--2-icon__insta'>
                <use xlinkHref={sprite + '#icon-instagrem'} />
              </svg>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default SearchBar;
