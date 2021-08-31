from flask import Flask, render_template

app = Flask(__name__, template_folder='views', static_folder='client-stack')


@app.route('/')
def home():
    return render_template('index.html')


if __name__ == '__main__':
    app.run()
