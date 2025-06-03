FROM alpine:3.21
WORKDIR /opt/lucle
ARG TARGETARCH

COPY lucle-$TARGETARCH/lucle .
RUN chmod +x lucle

COPY web/dist ./web/dist
COPY pkey .

EXPOSE 8112

CMD ["./lucle"] 
