import Config from "chart.js/dist/core/core.config";

export const send_event_allo = async (client: any) =>
  new Promise((resolve, reject) => {
    client
      .send_event({
        plugin: "test",
      })
      .then(() => {
        resolve();
      })
      .catch((error: any) => {
        reject(error);
      });
  });

export const build_custom_launcher = async (
  client: any,
  launcher_name: string,
  repository_name: string,
  game_name: string,
  update_server_url: string,
  plugins_url: string,
  config_file: string,
) =>
  new Promise((resolve, reject) => {
    console.log(client);
    client
      .create_workflow({
        launcher_name: launcher_name,
        repository_name: repository_name,
        game_name: game_name,
        speedupdate_server_url: update_server_url,
        plugins_url: plugins_url,
        config_file: config_file,
      })
      .then(() => {
        resolve();
      })
      .catch((error: any) => {
        reject(error);
      });
  });
