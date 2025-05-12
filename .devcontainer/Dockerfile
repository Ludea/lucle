FROM ghcr.io/lapce/lapdev-devcontainer-gnome

RUN apt-get update && apt install -y --no-install-recommends \
    build-essential \
    wget \
    mariadb-server \
    nodejs \
    npm \
    git

RUN chown mysql:root /run/mysqld
RUN service mariadb start
RUN npm install -g pnpm

RUN curl https://sh.rustup.rs -sSf | bash -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

RUN curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3
RUN chmod 700 get_helm.sh
RUN ./get_helm.sh
#RUN cd /workspaces/lucle && cargo build
#RUN cd /workspaces/lucle/web && pnpm install

RUN git clone https://github.com/Ludea/speedupdate-rs /workspaces/speedupdate-rs
#RUN cd /workspaces/speedupdate-rs && cargo build

RUN git clone https://github.com/Ludea/Sparus /workspaces/Sparus
#RUN cd /workspaces/Sparus && pnpm install 

RUN install -d -m 0755 /etc/apt/keyrings
RUN wget -q https://packages.mozilla.org/apt/repo-signing-key.gpg -O- | tee /etc/apt/keyrings/packages.mozilla.org.asc > /dev/null
RUN echo "deb [signed-by=/etc/apt/keyrings/packages.mozilla.org.asc] https://packages.mozilla.org/apt mozilla main" | tee -a /etc/apt/sources.list.d/mozilla.list > /dev/null
RUN apt update && apt install -y firefox
