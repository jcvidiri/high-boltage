import React from 'react';
import ReactDOM from 'react-dom';
import HBoltage from './HBoltage';

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<HBoltage />, div);
  ReactDOM.unmountComponentAtNode(div);
});
