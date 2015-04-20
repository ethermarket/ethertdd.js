#!/usr/bin/env python
import SimpleHTTPServer
import SocketServer

PORT = 8081

class NoCacheHandler(SimpleHTTPServer.SimpleHTTPRequestHandler):
    # Credit to http://stackoverflow.com/questions/12193803/invoke
    # -python-simplehttpserver-from-command-line-with-no-cache-option
    def end_headers(self):
        self.send_my_headers()
        SimpleHTTPServer.SimpleHTTPRequestHandler.end_headers(self)

    def send_my_headers(self):
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")

if __name__ == '__main__':
    httpd = SocketServer.TCPServer(("", PORT), NoCacheHandler)
    print "Serving files at http://localhost:%s/" % PORT
    print "Ctrl+C to stop..."
    httpd.serve_forever()

