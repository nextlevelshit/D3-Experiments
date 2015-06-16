/**
 * Created by nextlevelshit on 26.03.15.
 */
module.exports = function(grunt){

    "use strict";

    require("matchdep").filterDev("grunt-*").forEach(grunt.loadNpmTasks);

    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),

        htmlhint: {
            build: {
                options: {
                    'tag-pair': true,
                    'tagname-lowercase': true,
                    'attr-lowercase': true,
                    'attr-value-double-quotes': true,
                    'doctype-first': true,
                    'spec-char-escape': true,
                    'id-unique': true,
                    'head-script-disabled': true,
                    'style-disabled': true
                },
                src: ['index.html']
            }
        },

        watch: {
            html: {
                files: ['index.html'],
                tasks: ['htmlhint']
            },

            js: {
                files: ['assets/js/*'],
                tasks: ['uglify']
            },

            css: {
                files: ['assets/sass/**/*.scss'],
                tasks: ['buildcss']
            }
        },

        uglify: {
            build: {
                files: {
                    'build/js/app.min.js': ['assets/js/*']
                }
            }
        },

        cssc: {
            build: {
                options: {
                    consolidateViaDeclarations: true,
                    consolidateViaSelectors:    true,
                    consolidateMediaQueries:    true
                },
                files: {
                    'build/css/master.css': 'build/css/master.css'
                }
            }
        },

        cssmin: {
            build: {
                src: 'build/css/master.css',
                dest: 'build/css/master.css'
            }
        },

        sass: {
            build: {
                files: {
                    'build/css/master.css': 'assets/sass/master.scss'
                }
            }
        }
    });

    grunt.registerTask('default', ['watch']);
    grunt.registerTask('buildcss',  ['sass', 'cssc', 'cssmin']);

};