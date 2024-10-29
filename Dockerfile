FROM alpine:3.20 AS alpine
WORKDIR /opt/lucle
ARG TARGETARCH

COPY lucle-$TARGETARCH/lucle .
RUN chmod +x lucle

COPY  web/dist ./web/dist
RUN ls -Rlah .
RUN stat ./lucle 
EXPOSE 3000
EXPOSE 8080

CMD ["./lucle"] 
