import React from 'react';

class SearchBar extends React.Component {
  state = { term: '' };

  onFormSubmit = (event) => {
    event.preventDefault();

    this.props.onSubmit(this.state.term);
  };

  render() {
    return (
      <div className='container__search'>
        <form onSubmit={this.onFormSubmit} className='form'>
          <input
            className='form__input'
            type='text'
            placeholder='Search for images'
            value={this.state.term}
            onChange={(event) => {
              this.setState({ term: event.target.value.toUpperCase() });
            }}
          />
        </form>
      </div>
    );
  }
}

export default SearchBar;
