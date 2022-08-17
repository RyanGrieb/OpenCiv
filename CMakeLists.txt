cmake_minimum_required(VERSION 3.22)
project(OpenCiv)

set(CMAKE_CXX_STANDARD 17)
set (CMAKE_LIBRARY_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR})
set (CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR})

if (WIN32)
    #[[
    We link libstdc++ statically. The difference b/w static & dynamic linking is as follows:
    Dynamic linking relies on .dll dependency files from the operating-system/program to be referenced when the program is ran
    Static linking libraries are linked together during link-time. So all dependencies are in the executable & ready to go at runtime.

    I think we do this to allow the .exe to be ran on other computers w/o sdl2 or c++ dependencies installed
    ]]
    set(CMAKE_CXX_FLAGS "-static-libstdc++ -static-libgcc") # Link libstdc++ & libgcc statically.
    message(STATUS "Current CXX_FLAGS: ${CMAKE_CXX_FLAGS}") #FIXME: We can't see this unless set to WARNING

    set(SDL2_INCLUDE_DIR ${PROJECT_SOURCE_DIR}/dependencies/sdl/include) # Define our header directory
    set(SDL2_LIB_DIR ${PROJECT_SOURCE_DIR}/dependencies/sdl/lib/x64) # Define the library directory
    set(SDL2_IMAGE_INCLUDE_DIR ${PROJECT_SOURCE_DIR}/dependencies/sdl_image/include)
    set(SDL2_IMAGE_LIB_DIR ${PROJECT_SOURCE_DIR}/dependencies/sdl_image/lib/x64)

    include_directories(${SDL2_INCLUDE_DIR} ${SDL2_IMAGE_INCLUDE_DIR}) # Include our header files for our IDE & Compiler to interpret. - Code completion, ect.
    link_directories(${SDL2_LIB_DIR} ${SDL2_IMAGE_LIB_DIR}) # Spins up the .lib files for us to reference in `target_link_libraries`

    # Define sdl2 .dll & .lib file locations to be referenced when the project is ran/debugged, ect.
    add_library(sdl2 SHARED IMPORTED GLOBAL)
    set_property(TARGET sdl2 PROPERTY IMPORTED_IMPLIB_RELEASE "${PROJECT_SOURCE_DIR}/dependencies/sdl/lib/x64/SDL2.lib")
    set_property(TARGET sdl2 PROPERTY IMPORTED_LOCATION_RELEASE "${PROJECT_SOURCE_DIR}/dependencies/sdl/lib/x64/SDL2.dll")
    set_property(TARGET sdl2 PROPERTY IMPORTED_IMPLIB_DEBUG  "${PROJECT_SOURCE_DIR}/dependencies/sdl/lib/x64/SDL2.lib")
    set_property(TARGET sdl2 PROPERTY IMPORTED_LOCATION_DEBUG "${PROJECT_SOURCE_DIR}/dependencies/sdl/lib/x64/SDL2.dll")

    add_library(sdl2_image SHARED IMPORTED GLOBAL)
    set_property(TARGET sdl2_image PROPERTY IMPORTED_IMPLIB_RELEASE "${PROJECT_SOURCE_DIR}/dependencies/sdl_image/lib/x64/SDL2_image.lib")
    set_property(TARGET sdl2_image PROPERTY IMPORTED_LOCATION_RELEASE "${PROJECT_SOURCE_DIR}/dependencies/sdl_image/lib/x64/SDL2_image.dll")
    set_property(TARGET sdl2_image PROPERTY IMPORTED_IMPLIB_DEBUG  "${PROJECT_SOURCE_DIR}/dependencies/sdl_image/lib/x64/SDL2_image.lib")
    set_property(TARGET sdl2_image PROPERTY IMPORTED_LOCATION_DEBUG "${PROJECT_SOURCE_DIR}/dependencies/sdl_image/lib/x64/SDL2_image.dll")
else ()
    find_package(SDL2 REQUIRED) # Finds the package installed on the linux machine.
    find_package(SDL_image REQUIRED)
    include_directories(${SDL2_INCLUDE_DIRS} ${SDL_IMAGE_INCLUDE_DIRS}) # Include our header files for our IDE & Compiler to interpret. - Code completion, ect.
    # We don't need to call link_directories here since we already know where the libraries are w/ 'find_package'
endif ()

set(SOURCE_FILES main.cpp) # Define our source files for the project. These turn into our executables...
add_executable(${PROJECT_NAME} ${SOURCE_FILES}) # Set our main.cpp as our executable file

if (WIN32)
    target_link_libraries(${PROJECT_NAME} SDL2main SDL2 SDL2_image) # Link our .lib files for our linker - enables our program to compile w/ that dependency

    # Copy .dll files to .exe location
    add_custom_command ( TARGET ${PROJECT_NAME} POST_BUILD
            COMMAND ${CMAKE_COMMAND} -E copy_if_different
            $<TARGET_FILE:sdl2> $<TARGET_FILE_DIR:${PROJECT_NAME}>
            )
    add_custom_command ( TARGET ${PROJECT_NAME} POST_BUILD
            COMMAND ${CMAKE_COMMAND} -E copy_if_different
            $<TARGET_FILE:sdl2_image> $<TARGET_FILE_DIR:${PROJECT_NAME}>
            )
else ()
    #FIXME: Referencing ${SDL2_IMAGE_LIBRARIES} doesn't work?
    target_link_libraries(${PROJECT_NAME} ${SDL2_LIBRARIES} SDL2_image) # Link our library files for our linker, same as above but for linux.
endif ()