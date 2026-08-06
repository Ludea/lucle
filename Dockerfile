FROM alpine:3.23
WORKDIR /opt/lucle
ARG TARGETARCH

COPY lucle_$TARGETARCH/lucle .
RUN chmod +x lucle

COPY web/dist ./web/dist

EXPOSE 8112

CMD ["./lucle"] 
