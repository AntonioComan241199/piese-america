import React, { useEffect } from "react";
import PropTypes from "prop-types";

const Helmet = ({ title, children }) => {
  useEffect(() => {
    document.title = `Piese Auto America - ${title}`;
  }, [title]); // Se va actualiza titlul doar când `title` se schimbă

  return <div className="w-100">{children}</div>;
};

Helmet.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
};

export default Helmet;
