import React from 'react';

class ImageCard extends React.Component {
  constructor(props) {
    super(props);

    this.state = { span: 0 };

    this.imageRef = React.createRef();
  }

  componentDidMount() {
    this.imageRef.current.addEventListener('load', this.setSpans);
  }

  setSpans = () => {
    const height = this.imageRef.current.clientHeight;
    console.log(height);

    const span = Math.ceil(height / 10 + 1);

    this.setState({ span });
  };
  render() {
    const { discription, urls } = this.props.image;

    return (
      <div style={{ gridRowEnd: `span ${this.state.span}` }}>
        <img ref={this.imageRef} alt={discription} src={urls.small} />
      </div>
    );
  }
}

export default ImageCard;
