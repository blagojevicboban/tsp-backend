import { mergeConfig } from 'vite';

export default (config) => {
  return mergeConfig(config, {
    server: {
      allowedHosts: ['novi.tsp.edu.rs', 'www.novi.tsp.edu.rs'],
    },
  });
};
