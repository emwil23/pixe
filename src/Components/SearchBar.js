import React from 'react';

import EW from '../img/EWpro.jpg';
import sprite from '../img/sprite.svg';
import icon from '../img/icon.png';
import pixeb from '../img/pixe-black.png';
import navicon from '../img/nav-icon.png';

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
        <div className='page-icon'>
          <img src={icon} alt='page icon' className='page-icon--1' />
        </div>
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
            <div className='dev__nav-container'>
              <div className='dev__nav-appicon'>
                <img src={pixeb} alt='logo of brand' />
              </div>
              <div className='dev__nav-name'>
                <div className='dev__nav-name--title'>Developer:</div>
                <div className='dev__nav-name--text'>Emmanuel</div>
                <div className='dev__nav-name--sub'>Wilson</div>
              </div>
              <div className='dev__nav-icon'>
                <img
                  src={navicon}
                  alt='nav icon yoo'
                  className='dev__nav-icon'
                />
              </div>
              <div className='dev__nav-sharing'>
                <div className='dev__nav-sharing--title'>Get in Touch</div>
                <div className='dev__nav-sharing--email'>
                  <form className='email-form'>
                    <input
                      type='text'
                      readOnly={true}
                      className='email-form__input'
                      value='emmanuel23jazz@gmail.com'
                      id='emailcpy'
                    />
                  </form>
                  <svg
                    className='email-form__copy'
                    onClick={() => {
                      document.getElementById('emailcpy').select();
                      document.execCommand('copy');
                      alert('Copied');
                    }}
                  >
                    <use xlinkHref={sprite + '#icon-clone'} />
                  </svg>
                </div>
                <div className='dev__nav-sharing--link'>
                  <svg
                    className='dev__nav-sharing--link-1'
                    onClick={() => {
                      window.open('https://github.com/emwil23', '__blank');
                    }}
                  >
                    <use xlinkHref={sprite + '#icon-github'} />
                  </svg>
                  <svg
                    className='dev__nav-sharing--link-1'
                    onClick={() => {
                      window.open(
                        'https://www.instagram.com/iam_e.w/',
                        '__blank'
                      );
                    }}
                  >
                    <use xlinkHref={sprite + '#icon-instagrem'} />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default SearchBar;
